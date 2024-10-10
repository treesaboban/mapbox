import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppserviceService } from '../../services/appservice.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule,],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit{
  
  @Output() closePopup: EventEmitter<any> = new EventEmitter();
  @Input() userData : any;
  userInfo=[];
  editCustomerForm!:FormGroup;
  Id='';
  constructor(private activatedRoute:ActivatedRoute,
    private editCustRouter:Router,
    private apps:AppserviceService) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe({
      next:(data)=>{
        this.Id = data['id'].replace(/:/g,''); 
        this.apps.getCustomer().subscribe((res)=>{
         this.userInfo = JSON.parse(JSON.stringify(res));
         const user = res.find((a: any) => {
          return (
            a.id === this.Id
          );
        });
        if(user) {
          this.editCustomerForm = new FormGroup({
            userName: new FormControl(user.userName,[Validators.required]),
            email: new FormControl(user.email, [Validators.required]),
            phone: new FormControl(user.phone, [Validators.required])
          });
        }
        })
      },
      error: (err) => {
        console.error(err);
    }
    })

    
  }

  closePopupEdit(data:boolean): void {
    console.log(data);
    this.closePopup.emit(data);
    this.editCustRouter.navigateByUrl('view-user-list');
  }

  edit(): void{
   if(this.editCustomerForm.valid) {
      console.log(this.editCustomerForm.value);
      this.apps.editCustomer(this.Id,this.editCustomerForm.value).subscribe((data)=>{
       console.log('updated:',data);
       
      })
      alert('updated successfully !!');
      this.editCustRouter.navigateByUrl('view-user-list');
   }
   else {
    alert("invalid request!!")
  }
  }
}
