import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppserviceService } from '../../services/appservice.service';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from '../../pipes/filter.pipe';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { DeleteUserComponent } from '../delete-user/delete-user.component';

@Component({
  selector: 'app-view-user',
  standalone: true,
  imports: [FormsModule,FilterPipe,EditUserComponent,DeleteUserComponent],
  templateUrl: './view-user.component.html',
  styleUrl: './view-user.component.css',
  
})
export class ViewUserComponent implements OnInit {

  allUsers = [] as any;
  searchText = '';
  public userInfo = [] as any;
  editUserPopup = false;
  deleteUserPopup = false;

  constructor(private apps: AppserviceService, private router: Router) {}

  ngOnInit(): void {
    this.getUsers();
  }

  backtoHome():void {
   this.router.navigateByUrl('admin-home');
  }

  search(event:any)
  {
     this.searchText=event.target.value
     console.log(this.searchText);
     
  }

  getUsers(): void {
    this.apps.getCustomer().subscribe((data:any)=>{
      console.log(data);
      this.allUsers = data.filter((x:any)=>x.role!='admin' && x.status == '1');
    })
  }

  editUserDetails(data:any,index:any): void {
    this.editUserPopup = true;
    this.userInfo = data;
    console.log('edit',this.userInfo,index);
    this.router.navigateByUrl(`edit-user/:${this.userInfo.id}`) 
  }

  deleteUserDetails(data:any,index:any): void {
    this.deleteUserPopup = true;
    this.userInfo = data;
    console.log('del',this.userInfo,index);
    this.router.navigateByUrl(`delete-user/:${this.userInfo.id}`) 
  }

  closePopup(flag:any): void {
    console.log(flag);

    this.editUserPopup = false;
  }
}
