import { HttpClientModule,HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppserviceService {
   url="http://localhost:3000/Users";
   
   public loader$ = new Subject<boolean>();
  constructor(private http:HttpClient) { }

  login()
  {
    return this.http.get(this.url)
  }
  
  getCustomer(): Observable<any>
  {
    return this.http.get(this.url)
  }

  addCustomer(data:any): Observable<any>
  {
    return this.http.post(this.url,data)
  }

  // getCustomerById(id:any){
  //   return this.http.get(`${this.url}/${id}`)
  // }

  editCustomer(id: string,body: any): Observable<any>
  {
    return this.http.patch(`${this.url}/${id}`,body)
  }

  delCustomer(id: string): Observable<any>
  {
    return this.http.delete(`${this.url}/${id}`)
  }
}
