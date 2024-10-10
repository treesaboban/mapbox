import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppserviceService } from '../../services/appservice.service';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule,],
  templateUrl: './delete-user.component.html',
  styleUrl: './delete-user.component.css'
})
export class DeleteUserComponent implements OnInit{
  
  @Output() closePopup: EventEmitter<any> = new EventEmitter();
  @Input() userData : any;
  userInfo=[];
  delCustomerForm!:FormGroup;
  Id='';
  constructor(private activatedRoute:ActivatedRoute,
    private delCustRouter:Router,
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
          this.delCustomerForm = new FormGroup({
            id: new FormControl(user.id,[Validators.required]),
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
    this.delCustRouter.navigateByUrl('view-user-list');
  }

  delCustomer(): void{
   if(this.delCustomerForm.valid) {
      console.log(this.delCustomerForm.value);
      this.apps.delCustomer(this.Id).subscribe((data)=>{
       console.log('del:',data);
      })
      alert('deleted successfully !!');
      this.delCustRouter.navigateByUrl('view-user-list');
   }
   else {
     alert("invalid request")
   }
  }
}
