import { Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppserviceService } from '../../services/appservice.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule,
    MatDialogModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    HttpClientModule
  ],
  // providers: [AppserviceService],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css',
})
export class AddUserComponent implements OnInit {
  addCustomerForm!: FormGroup;
  @Output() closePopup: EventEmitter<any> = new EventEmitter();
  @Input() showPopup: boolean = false;

  constructor(
    private addcustFB: FormBuilder,
    private apps: AppserviceService,
    private router: Router,
    private renderer:Renderer2
  ) {}

  ngOnInit(): void {
    console.log('add form');
    
    this.addCustomerForm = new FormGroup({
      userName: new FormControl('', [
        Validators.required,
        // Validators.pattern('^[a-zA-Z]+( [a-zA-z]+)*$'),
      ]),
      phone:  new FormControl(null, [
        Validators.required,
        // Validators.maxLength(10),
        // Validators.pattern('^[0-9]{10}'),
      ]),
      email:  new FormControl('', [
        Validators.required,
        // Validators.email,
        // Validators.pattern(
        //   '^[a-zA-Z0-9]+(?:.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:.[a-zA-Z0-9]+)*$'
        // ),
      ]),
    });
    // const c = JSON.parse(localStorage.getItem('user') as string);
    console.log(this.addCustomerForm.value);

  }

  closePopupAdd(): void {
    this.closePopup.emit();
    this.showPopup = false;
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeClass(document.body,'modal-backdrop');
  }

  addCustomers() {
    if (this.addCustomerForm.valid) 
    {
        this.apps.getCustomer().subscribe((data:any)=>{
          console.log(data);
          const checkUser=data.find((a : any) => {
               return a.email === this.addCustomerForm.value.email});
               if (checkUser){
                alert('email already exists!!');
                this.router.navigateByUrl("admin-home");
                this.closePopupAdd();
            }
            else{
              const newUser ={
                 id:this.generateUserId(),
                ...this.addCustomerForm.value,
                role:'user',
                password:this.generatePassword(8),
                status: "1"
              };
              console.log('newUser :', newUser);
              this.apps.addCustomer(newUser).subscribe((res)=>{
                console.log('added:',res);
                alert('New user added successfully');
                // document.body.classList.remove('modal-backdrop');
              this.closePopupAdd();

              })
            }
        })
    } 
    else 
    {
        alert('Empty fields!!Please try again!!');
    }
}

generateUserId(): string {
  const uid = Math.floor((1 + Math.random()) * 0x10000).toString(8).slice(-5);
  return uid;
}

generatePassword(length : number) :string{
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+|.?';

  let password = '';

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);

      password += charset.charAt(randomIndex);
  }

  return password;
}

}
