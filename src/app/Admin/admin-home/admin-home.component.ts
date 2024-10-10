import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, Renderer2, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppserviceService } from '../../services/appservice.service';
import { AddUserComponent } from '../add-user/add-user.component';
import { ViewUserComponent } from '../view-user/view-user.component';
// interface UserInterface {
//   id: string;
//   name: string;
//   role: string;
// }
@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [AddUserComponent,HttpClientModule,ViewUserComponent],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css',
  // providers: [AppserviceService],
})
export class AdminHomeComponent implements OnInit{
  // users = signal<UserInterface[]>([
  //   { id: '1', name: 'foo', role: 'developer' },
  //   { id: '2', name: 'bar', role: 'admin' },
  //   { id: '3', name: 'baz', role: 'qa' },
  // ]);
  // user=this.users()[0]
  addUserPopup = false;
  // allUsers=[] as any;
  
  constructor(
    private router: Router,
    private renderer:Renderer2,
    private apps:AppserviceService
  ) {}

  ngOnInit(): void {
    // this.getUsers();
  }

  // getUsers(): void {
  //   this.apps.getCustomer().subscribe((data:any)=>{
  //     this.allUsers = data.filter((x:any)=>x.role!='admin');
  //   })
  // }

  viewUserPopup(): void {
   this.router.navigateByUrl('view-user-list');
  }
}
