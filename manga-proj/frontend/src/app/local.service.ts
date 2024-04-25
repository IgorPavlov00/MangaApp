import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LocalService {

  private url: string;

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

  getUser(token: string | null): Observable<object> {
    const httpOptions = {
      headers: new HttpHeaders(
        {'Content-Type': 'application/json'}
      )
    };
    return this.http.get('http://localhost:8084/getUser?token=' + token, httpOptions);

  }

}
