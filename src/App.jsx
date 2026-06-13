import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase'; 

export default function App() {
  // 1. Setup our variables
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Fetch the data from Supabase
  useEffect(() => {
    //async just tells to wait till we fetch the data from supabase
    async function fetchTasks() {
      //data and error are 2 things we care about
      const { data, error } = await supabase.from('Routine_Habits').select('*'); // await tells exactly where to stop & select * tells to send all data present in the base
      
      if (error) {
        console.error('Error fetching habits:', error);
      } else {
        setTasks(data); // Save the database rows into our React app
      }
      setLoading(false);
    }
    //this is the exact trigger that tells to run the function
    fetchTasks();
  }, []); // [] tells to stop re-rendering

  // 3. Show a loading screen while fetching, when fetching done setTasks is toggled and we render the actual data
  if (loading) {
    return <div className="p-10 text-center font-bold">Loading your habits...</div>;
  }

  // 4. Draw the actual screen
  return (
    <main className="min-h-screen bg-gray-50 p-10 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dynamic Habit Heatmap</h1>
        {/* Checkboxes Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Today's Tasks</h2>
          {/* if no task it tells that no task */}
          {tasks.length === 0 ? (
            <p className="text-gray-500">No habits added yet!</p>
          ) : 
          /* if tasks are there .map() just runs a loop on all the data */
          (
            tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg"> 
              {/**task.id is used to update and delete as react doesnt know which exact row are we talking about */}
                <input type="checkbox" className="w-5 h-5 cursor-pointer" />
                <span className="text-gray-700">{task.task_name}</span> {/*.id, .task_name are names from our SQL*/}
              </div>
            ))
          )}
        </div>

        {/* AI Input Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">AI Brain Dump</h2>
          <textarea 
            className="w-full p-3 border border-gray-300 rounded-lg outline-none"
            rows="3"
            placeholder="What else do you need to do today?"
          ></textarea>
          <button className="mt-3 w-full bg-black text-white px-4 py-3 rounded-lg font-semibold cursor-pointer">
            Generate Smart Tasks
          </button>
        </div>
      </div>
    </main>
  );
}