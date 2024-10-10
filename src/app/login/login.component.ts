import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators,FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppserviceService } from '../services/appservice.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  // providers: [AppserviceService],
})
export class LoginComponent implements OnInit {
  
  signInForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });
  txtMsg ='';
  showLoader = false;
  userFormSubmitted = false;

  constructor(private apps: AppserviceService, private router: Router) {}
  
  
  ngOnInit(): void {}

  login(): void {
    this.userFormSubmitted = true;
    // let data = {
    //   email: this.signInForm.controls['email'].value,
    //   password: this.signInForm.controls['password'].value,
    // };
    if (this.signInForm.valid) {
      console.log(this.signInForm.value);
      
      this.showLoader = true;
      console.log(this.signInForm.value);
      this.apps.login().subscribe((res: any) => {
        console.log(res);
        const user = res.find((a: any) => {
          return (
            a.email === this.signInForm.value.email &&
            a.password === this.signInForm.value.password
          );
        });
         if(user){
          if(user.role === 'admin') {
            setTimeout(() => {
             this.showLoader = false;
             this.txtMsg= 'Login Success';
             localStorage.setItem("user", JSON.stringify(user));
             this.router.navigateByUrl('admin-home');
            }, 3000);
          }
          else {
            setTimeout(() => {
              this.showLoader = false;
               this.txtMsg= 'Login Success';
               localStorage.setItem("user", JSON.stringify(user));
              this.router.navigateByUrl('user-home');
             }, 1000);
          }
         }
         else {
          setTimeout(() => {
            this.showLoader = false;
            this.txtMsg= 'Login Failed';
            this.userFormSubmitted = false;
            this.reset();
           }, 1000); 
         }
      });
    }
  }

  reset(): void {
    this.signInForm.patchValue({
      email: '',
      password: '',
    });
  }
}
