// register.component.ts

import { Component } from '@angular/core';
import { UserService } from 'src/app/user.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  user = {
    firstName: '',
    lastName: '',
    emailId: '',
    password: ''
  };

  constructor(private userService: UserService, private router: Router) {
  }

  registerUser() {
    this.userService.registerUser(this.user).subscribe(
      response => {
        console.log('Registration successful', response);
        this.router.navigate(['registration-success', this.user.emailId]);
      },
      error => {
        console.error('Registration failed', error);
        // Handle registration error
      }
    );
  }
}
