import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppserviceService } from '../../services/appservice.service';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.css',
})
export class ViewProfileComponent implements OnInit {
  Id = '';
  user: any;
  enableEdit = false;
  showLoader = false;
  editForm!: FormGroup;

  constructor(
    private apps: AppserviceService,
    private editCustRouter: Router
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') as string);
    console.log('in ls:', this.user);
    this.Id = this.user.id;
    this.editForm = new FormGroup({
      userName: new FormControl(this.user.userName, [Validators.required]),
      email: new FormControl(this.user.email, [Validators.required]),
      phone: new FormControl(this.user.phone, [Validators.required]),
      password: new FormControl(this.user.password, [Validators.required]),
    });
  }

  editProfile(flag: boolean): void {
    if (flag) {
      this.enableEdit = true;
      this.showLoader = true;
      setTimeout(() => {
        this.showLoader = false;
        // this.enableEdit = false;
      }, 1000);
    } else {
      this.editForm.patchValue({
        userName: this.editForm.controls['userName'].value,
        email: this.editForm.controls['email'].value,
        phone: this.editForm.controls['phone'].value,
        password: this.editForm.controls['password'].value,
      });
      console.log(this.editForm.value);
      this.apps.editCustomer(this.Id, this.editForm.value).subscribe((data) => {
        alert('updated successfully');
        this.editCustRouter.navigateByUrl('');
      });
    }
  }

  goBack(): void {
    this.showLoader = true;
    setTimeout(() => {
      this.showLoader = false;
      this.editCustRouter.navigateByUrl('user-home');
    }, 1000);
  }
}
