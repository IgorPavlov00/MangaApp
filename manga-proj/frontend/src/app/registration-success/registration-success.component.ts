// registration-success.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.css']
})
export class RegistrationSuccessComponent implements OnInit {
   emailId: string | null | undefined;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.emailId = this.route.snapshot.paramMap.get('emailId');
  }
}
