import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LocalService {

  private url: string;
  private baseUrl = 'http://localhost:8084'; // Update with your API base URL

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

}
