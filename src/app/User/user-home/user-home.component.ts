import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ViewProfileComponent } from '../view-profile/view-profile.component';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [ViewProfileComponent],
  templateUrl: './user-home.component.html',
  styleUrl: './user-home.component.css'
})
export class UserHomeComponent implements OnInit{
    
     showPage = false;

     constructor(private router:Router){}

     ngOnInit(): void {
    }

     viewProfile(): void {
      this.router.navigateByUrl("view-profile");
     }
}
