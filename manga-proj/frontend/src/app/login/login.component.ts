import {Component, ElementRef, Renderer2} from '@angular/core';
import {LoginService} from "../login.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Korisnik} from "../korisnik";
import {LocalService} from "../local.service";
import {UserService} from "../user.service";



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  container!: HTMLElement;
  registerBtn!: HTMLElement;
  loginBtn!: HTMLElement;

  showModal: boolean = false; // Add this line to track modal visibility

  isLoggedIn: boolean = false; // Add this line to declare the isLoggedIn property

  constructor(

    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService

  ) {}

  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };



  registerUser() {
    this.userService.registerUser(this.user).subscribe(
      response => {
        console.log('Registration successful', response);
        this.router.navigate(['registration-success', this.user.email]);
      },
      error => {
        console.error('Registration failed', error);
        // Handle registration error
      }
    );
  }


  ngOnInit(): void {
    this.container = document.getElementById('container')!;
    this.registerBtn = document.getElementById('register')!;
    this.loginBtn = document.getElementById('login')!;

    this.registerBtn.addEventListener('click', () => {
      this.container.classList.add('active');
    });

    this.loginBtn.addEventListener('click', () => {
      this.container.classList.remove('active');
    });
  }






}
