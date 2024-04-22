import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Korisnik} from "./korisnik";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private apiUrl = 'http://localhost:8084/korisnik';

  constructor(private http: HttpClient) {}

  public loginUser(username:string,password:string): Observable<any> {
   let data ={korisniko_ime:username,lozinka:password}
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  public getUsers(): Observable<Korisnik[]> {
    return this.http.get<Korisnik[]>(`${this.apiUrl}/svi`);
  }
}
