export default function Heatmap({tasks=[]}) {
  //get all the dates we have in our database into a single array
  const allDates = tasks.flatMap(task => task.completed_dates || []);
  //get all the unique dates using a set
  const uniqueDates = [...new Set(allDates)]; //... coz we are modifying the allDates array and returning it
  //create an array of length 30
  const last30Days = Array.from({length: 30}, (_,i) =>{
    const d= new Date(); //get todays date
    d.setDate(d.getDate() - (29-i));//get all the dates for last 30 days
    const dateString = d.toLocaleDateString('sv-SE');//get the dates in string format Y-M-D
    
    return uniqueDates.includes(dateString); // checks for each task is it in the string and assigns it T or F
  });

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-400 mb-8 uppercase tracking-wider text-center">
        30-Day Activity Heatmap
      </h3>
      {/* the grid container */}
      <div className="grid grid-cols-10 gap-2 w-fit mx-auto">
        {last30Days.map((isActive, index) => (
          <div
            key={index}
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all duration-300 ${
              isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-900/40' : 'bg-slate-800 border border-slate-700/50'
            }`}
            title={`Day ${index + 1}`}>
          </div>
        ))}
      </div>
    </div>
  );
}