// user.service.ts

import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {User} from "./User";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8084/auth'; // Replace with your backend URL
  private baseUrl = 'http://localhost:8084'; // Update with your API base URL

  constructor(private http: HttpClient) { }

  registerUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user);
  }

  loginUser(email: string, password: string): Observable<any> {
    const loginData = { email, password };
    return this.http.post<any>(`${this.apiUrl}/login`, loginData)
      .pipe(
        catchError((error: any) => {
          // Handle errors
          console.error('Login failed:', error);
          return throwError(error);
        })
      );
  }

  getUserById(userId: string): Observable<User> {
    const url = `${this.apiUrl}/${userId}`;
    return this.http.get<User>(url);
  }

  getUserByEmail(email: string): Observable<any> {
    // Retrieve token from local storage
    const token = localStorage.getItem('token');

    // Add token to request headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Make authenticated GET request
    return this.http.get(`${this.baseUrl}/auth/email/${email}`, { headers });
  }
}

