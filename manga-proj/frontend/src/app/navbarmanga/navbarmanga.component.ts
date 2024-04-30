import { Component } from '@angular/core';
import {LocalService} from "../local.service";

@Component({
  selector: 'app-navbarmanga',
  templateUrl: './navbarmanga.component.html',
  styleUrls: ['./navbarmanga.component.css']
})
export class NavbarmangaComponent {
  loggedInUserEmail: string | null = null; // Property to store the logged-in user's email

  constructor() { }

  ngOnInit(): void {
    // Retrieve the logged-in user's email from local storage
    this.loggedInUserEmail = localStorage.getItem('email');
  }
}
