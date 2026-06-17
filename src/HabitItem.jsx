import {supabase} from './utils/supabase';
import { getTodaydateInString } from './utils/date';
import { useState } from 'react';
import editIcon from './assets/edit.png';
import saveIcon from './assets/save.png';
import trashIcon from './assets/trash.png';

export default function HabitItem({task, onDelete, onUpdate, onEdit}) {
    //here comes the logic for updating the toggle checks using completed dates
    const today=getTodaydateInString(); //get todays date
    const completedDates=task.completed_dates || []; //get all the last 30 days
    
    // completedDates.includes(today)
    // Checks whether today exists in the array.
    const isCompleted = completedDates.includes(today); // we didnt use usestate here as it
    // coz we want to show data from server not our local memory, it may not work properly 
    //this gives a true or false

    //For editing, we need one var to tell if if is being edited 
    // and one tells that this is the updated name
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(task.task_name);
    // we keep this name so the user dont have to write the entire thing again
      
    async function toggleChanges() {
        //when change is detected, a new status is declared, i.e
        //if habit was not there, it would initially be false,
        //when toggled newStatus would say true and we would update database
        const newStatus=!isCompleted;
        let updatedDates;
        if(newStatus) {
            updatedDates=[...completedDates, today]; //add this date in the database
        }
        else {
            updatedDates=completedDates.filter(date => date !== today) //date which is similar to today,
            //or that date will be thrown out of the completeddates
        }
        onUpdate(task.id, updatedDates);
        //updating the server
        const {error} = await supabase
        .from('Routine_Habits')
        .update({completed_dates: updatedDates})
        .eq('id', task.id);

        if (error) {
            console.log("Failed to update database: ", error);
            onUpdate(task.id, completedDates); // Revert UI
        } 
        else {
            // when updated this tells the updateHeatmap in App.jsx
            // to update completed_dates and also update the UI 
            onUpdate(task.id, updatedDates);
        }
    }   

    //Delete Function logic
    async function deleteButton() {
        const {error} = await supabase
        .from('Routine_Habits')
        .delete()
        .eq('id', task.id);
        if(error) {
            console.log("Failed to delete: ", error);
        }
        else {
            //if sucessfully deleted
            onDelete(task.id);
        }
    }
    //edited name update logic
    async function saveEdit() {
        //if they didnt type anything or typed the same name then do nothing
        if (!editedName.trim() || editedName === task.task_name) {
          setIsEditing(false);
          return;
        }
				//for rendering we send the id and the edited name
				onEdit(task.id, editedName);
        setIsEditing(false);

				const {error} = await supabase
          .from('Routine_Habits')
          .update({task_name: editedName})
          .eq('id', task.id);

        if (error) {
          console.log("Failed to edit name: ", error);
          onEdit(task.id, task.task_name); // Revert if database fails
        }
    }

    //here comes the thing thart return markup code stuff to App.jsx and is rendered by App.jsx
    return (
        <div className="flex justify-between items-center gap-4 p-4 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-all group">
            <div className="flex items-center gap-4">
                <input
                    type="checkbox"
                    className="w-5 h-5 cursor-pointer accent-emerald-500"
                    checked={isCompleted}
                    onChange={toggleChanges}
                />
								{/* the conditional rendering, is it editing or reading */}
                {isEditing ? (
									<input 
                      type="text"
                      className="bg-slate-900 border border-emerald-500 text-white rounded-md px-3 py-1 w-full outline-none"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}//when we type it is registered by set edit to isEdited and value shows it on the screen
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}//on this when we press "Enter" saveedit is called
                      autoFocus//this directly puts the cursor inside and we dont need to manually type in
                    />
								) : (
									<p className={`font-medium text-lg transition-all ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {task.task_name}
                  </p>
								)}
            </div>
            <div className="flex items-center gap-3">
							{/*if editing is false we show edit icon else we show save ivon to save*/}
							{isEditing ? (
								<button onClick={saveEdit}>
									<img
										src={saveIcon}
										alt="Save"
										className="w-6 h-6"
										title="Save Habit"
									/>
								</button>
							) : (
								<button onClick={() => setIsEditing(true)}>
									<img
										src={editIcon}
										alt="Edit"
										className="w-6 h-6 mx-auto"
										title="Edit Habit"
									/>
								</button>
							)}
							<button onClick={deleteButton}>
              <img
                src={trashIcon}
                alt="Trash"
                className="w-6 h-6"
								title="Delete Habit"
              />
            	</button>
						</div>
        </div>
    );
}