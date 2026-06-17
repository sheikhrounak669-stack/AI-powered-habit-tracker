import { useState } from 'react';
import { supabase } from './utils/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false); //loading is just so users dont spam the button while waiting for the server
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); //used to show the log in or sign up page

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
		//prevents from refreshing when we press enter
		//loading is set to true so nobody can spam it

    try {
      if (isSignUp) { //if needed to sign-up it will create an account in supabase for us
				//using supabase.auth.signup({e-id, pw})
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Success! Check your email for a confirmation link.');
      } else { //if already signed-in supabase can do it using signInwithpw
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      alert(error.message);                   
    } finally {
      setLoading(false); //after signing in loading is set to false for the next user or next visit
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl w-full max-w-md flex flex-col gap-6">
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-2">HabitForge</h1>
          <p className="text-slate-500">Sign in to sync your habits</p>
        </div>
				{/* onSubmit the handleAuth function is called */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
					{/*taking in the inputs using */}
          <input
            className="bg-slate-800 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-emerald-500 transition-colors"
            type="email"
            placeholder="Your email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="bg-slate-800 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-emerald-500 transition-colors"
            type="password"
            placeholder="Your password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold cursor-pointer transition-colors mt-2"
            disabled={loading}
          >{/* if not loading, show sign up or log in, is we need to sign up show sign up else log in */}
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>
				{/*when we fill out the email and password and click the button, it fires 
				the onSubmit event on the form, which instantly calls our handleAuth function*/}

        <button 
          className="text-sm text-slate-400 hover:text-white transition-colors mt-2 cursor-pointer"
          onClick={() => setIsSignUp(!isSignUp)} //isSignUp state is used for both sign up and login
        >
          {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </button>

      </div>
    </div>
  );
}