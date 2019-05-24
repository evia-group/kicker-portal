import { Component, OnInit } from '@angular/core';

export interface IUser {
  firstname: string;
  lastname: string;
}

@Component({
  selector: 'app-add-match',
  templateUrl: './add-match.component.html',
  styleUrls: ['./add-match.component.scss']
})
export class AddMatchComponent implements OnInit {

  users: IUser[] = [
    {firstname: 'Dirk', lastname: 'ABC'},
    {firstname: 'Gena', lastname: 'ABC'},
    {firstname: 'Erik', lastname: 'ABC'},
    {firstname: 'Yara', lastname: 'ABC'}
  ];

  constructor() { }

  ngOnInit() {
  }

}
