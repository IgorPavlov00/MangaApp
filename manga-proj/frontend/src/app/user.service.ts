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

  getLoggedInUser(): Observable<any> {
    // Make a request to your backend to get the logged-in user information
    // This could be an endpoint that returns the user details based on the authentication token
    const token = localStorage.getItem('token');

    // Add token to request headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`${this.baseUrl}/auth/user`, { headers });
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


  // addMangaToUser(payload: any): Observable<any> {
  //   const token = localStorage.getItem('token');
  //
  //   // Add token to request headers
  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${token}`
  //   });
  //
  //   // Create a request body object with userId and mangaId
  //   const requestBody = {
  //     userId: payload.userId,
  //     mangaId: payload.mangaId,
  //     manga:payload.manga
  //   };
  //
  //   // Send a POST request with the request body
  //   return this.http.post<any>(`${this.apiUrl}/add/manga`, requestBody, { headers }).pipe(
  //     catchError((error: any) => {
  //       // Handle errors
  //       console.error('add manga failed:', error);
  //       return throwError(error);
  //     })
  //   );
  // }
  addMangaToUser(payload: any): Observable<any> {

    return this.http.post(`${this.apiUrl}/add/manga`, payload);
  }


  getUserMangaIds(id: any): Observable<number[]> {
    const token = localStorage.getItem('token');

    // Add token to request headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    console.log(id);
    return this.http.get<number[]>(`${this.apiUrl}/user/${id}/manga-ids`, { headers });
  }
}

