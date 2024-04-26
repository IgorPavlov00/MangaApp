import {Component, ElementRef, Renderer2} from '@angular/core';
import {LoginService} from "../login.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Korisnik} from "../korisnik";
import {LocalService} from "../local.service";
import {UserService} from "../user.service";
import {ToastrService} from "ngx-toastr";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";



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
  loginForm!: FormGroup;
  signUpForm!: FormGroup;


  isLoggedIn: boolean = false; // Add this line to declare the isLoggedIn property

  constructor(

    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private toast:ToastrService,
    private formBuilder: FormBuilder, // Make sure FormBuilder is injected


  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

  }

  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  loginUser() {
    if (this.loginForm.invalid) {
      return;
    }

    const email = this.loginForm.get('email')?.value; // Add "?" for safe navigation
    const password = this.loginForm.get('password')?.value; // Add "?" for safe navigation


    this.userService.loginUser(email, password).subscribe(
      (response) => {
        // Assuming the response contains a token upon successful login
        const token = response.token;
        // You can store the token in local storage or session storage for future requests
        localStorage.setItem('token', token);
        console.log(token)

        // Redirect to the desired page after successful login
        // Example: this.router.navigate(['/dashboard']);
        // Alternatively, you can emit an event to notify the parent component about the successful login
        this.toast.success('Logged in successfully!', 'Success');
        this.router.navigate(['/profil',email]); // Adjust the route as needed

      },
      (error) => {
        console.error('Login failed', error);
        this.toast.error('Login failed. Please check your credentials.', 'Error');
      }
    );
  }

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
