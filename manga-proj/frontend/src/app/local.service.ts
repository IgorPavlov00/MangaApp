import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LocalService {

  private url: string;
  private baseUrl = 'http://localhost:8084'; // Update with your API base URL
  private tokenKey = 'token';

  constructor(private http: HttpClient) {

    this.url = "http://localhost:8084/auth/activate";
  }

  verify(token: string | null): Observable<object> {
    console.log(this.url + '?token=' + token)
    const httpOptions = {
      headers: new HttpHeaders(
        {'Content-Type': 'application/json'}
      )
    };
    return this.http.get(this.url + '?token=' + token, httpOptions);

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




  // Get JWT token from local storage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    // Check if the token exists in local storage
    const token = localStorage.getItem('token');
    console.log(token)
    return !!token; // Returns true if token exists, false otherwise
  }


  // Example of attaching token to HTTP headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Example of making authenticated HTTP request
  getUserProfile(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.baseUrl}/user`, { headers }).pipe(
      catchError(error => {
        // Handle authentication error (e.g., token expired)
        if (error.status === 403) {
          // Clear token and log out user
          localStorage.removeItem(this.tokenKey);
          // Redirect user to login page or display appropriate message
        }
        return throwError(error);
      })
    );
  }

}
