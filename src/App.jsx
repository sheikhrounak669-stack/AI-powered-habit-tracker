import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase'; 
import HabitItem from './HabitItem';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Heatmap from './HeatMap';
import Auth from './Auth';

export default function App() {
  // 1. Setup our variables
  const [tasks, setTasks] = useState([]); //whatever the data comes from supabase is putin here

  //this is the logic state used to tell if we need to fire up authentication page
  //or we can directly show the original page
  const [session, setSession] = useState(null);

  // we put in an array named tasks which is later rendered using HabitItem
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState("");

  //set varaibles for brain dump & and to keep a variable to spam people from clicking the generate task button
  const [brainDump, setBrainDump] = useState("");
  const [isGenerating, setIsGenerating] =useState(false);

  //State to control our Info Modal
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // 2. The Authentication & Data Fetcher
  async function fetchTasks() { //fetching the data from supabase
    setLoading(true);
    const { data, error } = await supabase.from('Routine_Habits').select('*'); 
    if (error) {
      console.error('Error fetching habits:', error);
    } else {
      setTasks(data); 
    }
    setLoading(false);
  }

  useEffect(() => {
    // Check if we are currently logged in
    //when we refresh or go into the page, our browser checks our local cookies and
    //  getsession() pulls out the auth token and saves it to state, if token exists it triggers fetch task
    supabase.auth.getSession().then(({ data: { session } }) => { //the session keyword needs to be session as it is an object sent by supabase
    setSession(session);
      if (session) {
        fetchTasks(); // Only fetch if logged in
      }
      else {
        setLoading(false); // Stop loading if nobody is logged in
      }
    });

    // Listen for changes (like if the user logs in or out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchTasks();
      } else {
        setLoading(false); // <-- THE FIX
      }
    });
    //subscription(subs) is a variable created that actively listens for user actions
    //like user logs out in different window it will change state for all
    //and when component is destroyed the subscription is turned off

    return () => subscription.unsubscribe();
  }, []);

  // 3. Show a loading screen while fetching, when fetching done setTasks is toggled and we render the actual data
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-bold">Loading your habits...</div>;
  }
  if (!session) {
    return <Auth />;
  }
  //New habit added logic
  async function habitAdded() {
    //to stop making habits with empty blocks
    if(!newHabit.trim()) return;

    const {data, error} = await supabase
      .from('Routine_Habits')
      .insert([{task_name: newHabit,
        user_id: session.user.id
      }])
      .select();
      //if error
      if(error) {
        console.log("There is an error in adding new habit, error: ", error);
      }
      else {
        //... is used to modify array, and data[0] coz we are adding one piece of data 
        setTasks([...tasks, data[0]]);
        setNewHabit("");
      } 
  }
  //used for signing-out
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
  }

  //render the item that is deleted
  function removeTaskFromScreen(taskId) {
    //tasks array is again set by checking whose id we got to delete and whose is similar is skipped, that is 
    //our array is being updated
    setTasks(tasks.filter((t) => t.id !== taskId));
  }  
  //rendering the updated heatmap
  function updateHeatMap(taskId, newDates) {
    // Loop through tasks. If we find the one we clicked, give it the new dates.
    // Otherwise, leave the task exactly as it was.
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed_dates: newDates } : t
    ));
  }
  //edit task name when needed
  function editTaskName(taskId, newName) {
    setTasks(tasks.map(t => 
      t.id===taskId ? {...t, task_name: newName} : t
    ));
  }

  //logic for brain dump
  async function generateSmartTasks() {
    if(!brainDump.trim()) return;
    setIsGenerating(true); //if brain dump is empty do nothing else set isGenerating as true
    try {
      //calling the ai
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      //Get a comma-separated list of what the user is already doing
      const existingHabits = tasks.map(task => task.task_name).join(', ');
      //set the prompt
      const prompt = `
          You are an intelligent habit-tracking assistant.
          Convert the following messy paragraph into a list of short, actionable habit names.
          
          CRITICAL CONTEXT: The user already has the following habits on their dashboard: 
          [${existingHabits || "None yet"}]
          
          STRICT RULE: Do NOT generate or suggest any habits that are duplicates of, or highly similar to, the existing habits listed above. Provide entirely new suggestions based on the text.
          
          Return ONLY a valid JSON array of strings. Do not use markdown formatting or code blocks.
          
          User Text: "${brainDump}"
      `;
      //get the response
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      // as the response sent by google is a giant string, but we need a JS array, we use JSON.parse() to convert it
      const generatedTasksArray = JSON.parse(textResponse);
      //now we have an array of strings, but supabase needs an array of objects so we do that 
      const rowsToInsert = generatedTasksArray.map((taskName) => ({
        task_name: taskName,
        user_id: session.user.id
      }));
      //pass it supabase
      const {data, error} = await supabase
        .from('Routine_Habits')
        .insert(rowsToInsert)
        .select();

        if(error) throw error;

      // The Screen Update
      // ...tasks is your existing list. ...data is the brand new 
      // list of rows from the database. This merges them. 
       setTasks([...tasks, ...data]);
      //after generation, the prompt box is cleared
       setBrainDump("");
    } 
    catch (error) {
      console.log("Error in AI Generation: ", error);
      alert("There is a Heavy Demand right now!! Wait a few seconds and try again.");
    } 
    finally {
      setIsGenerating(false); 
      //set isgenerating free for future use
    }
  }

  // 4. Draw the actual screen
  return (
    <main className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-900 to-black pt-24 pb-10 px-4 font-sans text-slate-200 flex flex-col items-center relative selection:bg-emerald-500/30">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* TOP BLOCK: Heatmap & Streaks */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl w-full flex flex-col items-center">
          
          <div className="w-full mb-6">
            <Heatmap tasks={tasks}/>
          </div>
        </div>

        {/* MIDDLE BLOCK: Tasks & Setup */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl w-full">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Your Today's Tasks</h2>
          
          {/* The Input Area */}
<div className="flex flex-col sm:flex-row gap-3 mb-8">
  <input
              type="text"
              className="bg-slate-800 border-slate-700 border text-white rounded-xl flex-1 p-4 outline-none focus:border-emerald-500" 
              placeholder="New Habit"
              value={newHabit}
              onChange={(event) => setNewHabit(event.target.value)}
              // On every new click, the habit variable is updated 
              // and and it is updated by the arrow function*
            />
            <button
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold cursor-pointer transition-colors"
              onClick={habitAdded}
            >
              Add Habit
            </button>
          </div>

          {/* Checkboxes Section */}
          <div className="space-y-4">
            {/* if no task it tells that no task */}
            {tasks.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No habits added yet!</p>
            ) : 
            /* if tasks are there .map() just runs a loop on all the data */
            (
              <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                  //from here we are sending removetaskfromscreen as on delete and on the 
                  //habititem page and when we input task.id, it is registered as taskId
                  <HabitItem 
                  key={task.id} 
                  task={task} 
                  onDelete={removeTaskFromScreen} 
                  onUpdate={updateHeatMap}
                  onEdit={editTaskName}
                  /> /* here is a unique id (key is needed when rendering a list of items) and here passes the task object */
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM BLOCK: AI SMART GENERATOR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl w-full mb-10">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">AI Smart Generator</h2>
          <textarea 
            className="w-full bg-slate-800 p-4 border border-slate-700 rounded-xl outline-none text-slate-200 focus:border-blue-500 transition-colors"
            rows="3"
            placeholder="What else do you need to do today?"
            value={brainDump}
            onChange={(event) => setBrainDump(event.target.value)}
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateSmartTasks();
              }
            }}
          ></textarea>
          <button className={`mt-4 w-full px-4 py-4 rounded-xl font-bold cursor-pointer text-white transition-all shadow-lg uppercase tracking-wider ${
              isGenerating ? "bg-slate-700 text-slate-500" : "bg-blue-900 hover:bg-blue-800 shadow-blue-900/20"
            }`}
            //disabled is a property that makes an element (usually a button or input) unusable
            disabled={isGenerating}
            onClick={generateSmartTasks}
            >
            {isGenerating ? "Processing..." : "Generate Smart Tasks"}
          </button>
        </div>

      </div>

      {/* Info Tag Button */}
      <button 
        className="fixed top-6 right-6 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center 
        text-lg font-bold text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700 shadow-2xl transition-all cursor-pointer z-40"
        title="Information"
        onClick={() => setIsInfoOpen(true)} // Opens the modal
      >
        i
      </button>

      {/* THE INFO MODAL (Only renders if isInfoOpen is true) */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          
          {/* Modal Card */}
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in">
            
            <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">About HabitForge</h2>
            
            <div className="space-y-5 text-slate-300 text-sm leading-relaxed">
              <p>
                <strong className="text-emerald-400 block mb-1 uppercase tracking-wider text-xs">Heatmap</strong>
                Visually tracks your consistency over the last 30 days.
              </p>
              <p>
                <strong className="text-emerald-400 block mb-1 uppercase tracking-wider text-xs">Tasks</strong>
                Your daily command center. Add new habits, check them off, and permanently store your progress in the cloud database.
              </p>
              <p>
                <strong className="text-blue-400 block mb-1 uppercase tracking-wider text-xs">AI Smart Generator</strong>
                Powered by Gemini. Brain dump your messy thoughts, and the onboard AI will instantly extract and convert them into clean, actionable habits.
              </p>
            </div>

            <button 
              className="mt-8 w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer"
              onClick={() => setIsInfoOpen(false)} // Closes the modal
            >
              OK
            </button>
          </div>
          
        </div>
      )}
      {/* Sign Out Button */}
      <button 
        className="fixed top-6 left-6 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:border-slate-500 shadow-lg transition-all cursor-pointer z-40"
        onClick={handleSignOut}
      >
        Sign Out
      </button>

    </main>
  );
}