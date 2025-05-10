import React from 'react';
import "./notification.css"


const Notification = () => {
  return (
    <div className="notificationTable">
        <button type="button" class="btn btn-primary">
            Create <i class="fa-regular fa-bell"></i>
        </button>
      <table className="table table-bordered">
        
        <thead>
          <tr>
            <th scope="col">Notification ID</th>
            <th scope="col">Type</th>
            <th scope="col">Message</th>
            <th scope="col">Status</th>
            <th scope="col">Created At</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>    
             <tr>
             <td>1</td>
             <td>alert </td>
             <td>alert Messege </td>
             <td>sent </td>
             <td> </td>
             <td className='actionButtons'> 
             <button type="button" class="btn btn-info">
             <i class="fa-solid fa-pen-to-square"></i>
             </button>
                
             <button type="button" class="btn btn-danger">
             <i class="fa-solid fa-trash"></i>
             </button>

          </td>
         </tr>
         
         
         
        </tbody>
      </table>
    </div>
  );
};

export default Notification;
