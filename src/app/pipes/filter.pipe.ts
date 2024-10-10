import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone:true
})
export class FilterPipe implements PipeTransform
{
  transform(allUser:any= [], searchKey: string,propName:string): any[] 
  {
    console.log(searchKey,propName);
    
    const result:any=[]
    if(!allUser||searchKey==''||propName=='')
    {
        return allUser
    }
    //searching
    allUser.forEach((user:any) => {
      if(user[propName].trim().toLowerCase().includes(searchKey.toLowerCase()))
      {
       result.push(user)
      }
    });
    console.log(result);

    return result;
  }

}