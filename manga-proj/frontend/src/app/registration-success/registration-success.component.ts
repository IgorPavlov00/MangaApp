// registration-success.component.ts

import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from "ngx-toastr";
import {LocalService} from "../local.service";

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.css']
})
export class RegistrationSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private verifyService: LocalService,
    private  toast:ToastrService) {

    this.route.queryParamMap.subscribe((queryParams) => {
      const token = queryParams.get('token');
      verifyService.verify(token).subscribe();
      console.log(verifyService.verify(token))
    });


  }

  ngOnInit(): void {
    this.toast.info('You have succesfully verified your account!')
  }
}
