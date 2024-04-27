import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../User';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  user: User | undefined;
  userMangaIds: number[] = [];
  mangaDetails: any[] = [];
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const email = this.route.snapshot.paramMap.get('email');
    if (email) {
      this.userService.getUserByEmail(email).subscribe(
        (user: User) => {
          this.user = user;
          console.log('User by Email:', user);
          this.getUserMangaIds(user.id); // Move the call here
        },
        (error) => {
          console.error('Error fetching user by Email:', error);
        }
      );
    }

  }

  getUserMangaIds(id: any) {
    console.log(id);
    this.userService.getUserMangaIds(id).subscribe(
      (data: number[]) => {
        this.userMangaIds = data;
        console.log( this.userMangaIds);
        this.getMangaDetails(this.userMangaIds);
      },
      (error: any) => {
        console.error('Error fetching manga IDs:', error);
      }
    );
  }

  getMangaDetails(userMangaIds: number[]) {
    for (const mangaId of this.userMangaIds) {
      this.http.get(`https://api.jikan.moe/v4/manga/${mangaId}`).subscribe(
        (data) => {
          this.mangaDetails.push(data);
          console.log( this.mangaDetails);
        },
        (error) => {
          console.error(`Error fetching manga details for ID ${mangaId}:`, error);
        }
      );
    }
  }


  handleButtonClick(mangaId:number) {

    this.router.navigate(['/sec', mangaId]);
  }
}

