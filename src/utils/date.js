//function to return todays date
export function getTodaydateInString() {
  const today= new Date();
  return today.toLocaleDateString('sv-SE');
  // returns a string in YYYY-MM-DD format
}

export function last30Days() {
	//need an empty container to return the 30 days
	const datesContainer=[];
	for(let i=29; i>=0; i--) {
		const today=new Date();
		today.setDate(today.getDate-i);
		datesContainer.push(today.toLocaleDateString('sv-SE'));
	}
	return datesContainer;
}