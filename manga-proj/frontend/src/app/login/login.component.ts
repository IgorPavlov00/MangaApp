import {Component, ElementRef, Renderer2} from '@angular/core';
import {LoginService} from "../login.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Korisnik} from "../korisnik";
import {LocalService} from "../local.service";
import {UserService} from "../user.service";
import {ToastrService} from "ngx-toastr";



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
    private userService: UserService,
    private toast:ToastrService

  ) {}

  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };



  registerUser() {
    if (!this.user.firstName || !this.user.lastName || !this.user.email || !this.user.password || this.user.password.length < 8) {
      this.toast.error('Please fill in all the fields', 'Error');
      return;
    }

    // All fields are filled, proceed with registratio
    this.toast.success('Check your email at:'+this.user.email, 'Successful registration!');
    this.userService.registerUser(this.user).subscribe(
      response => {
      },
      error => {
        console.error('Registration failed', error);
        this.toast.error("Registration failed", "Error");
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
