import { Routes } from '@angular/router';
import { AddUserComponent } from './Admin/add-user/add-user.component';
import { AdminHomeComponent } from './Admin/admin-home/admin-home.component';
import { DeleteUserComponent } from './Admin/delete-user/delete-user.component';
import { EditUserComponent } from './Admin/edit-user/edit-user.component';
import { ViewUserComponent } from './Admin/view-user/view-user.component';
import { LoginComponent } from './login/login.component';
import { UserHomeComponent } from './User/user-home/user-home.component';
import { ViewProfileComponent } from './User/view-profile/view-profile.component';

export const routes: Routes = [
    {
        path:'',component:LoginComponent
    },
    {
        path:'user-home',component:UserHomeComponent
    },
    {
        path:'admin-home',component:AdminHomeComponent
    },
    {
        path:'add-user',component:AddUserComponent
    },
    {
        path:'view-user-list',component:ViewUserComponent
    },
    {
        path:'edit-user/:id',component:EditUserComponent
    },
    {
        path:'view-profile',component:ViewProfileComponent
    },
    {
        path:'delete-user/:id',component:DeleteUserComponent
    },
];
