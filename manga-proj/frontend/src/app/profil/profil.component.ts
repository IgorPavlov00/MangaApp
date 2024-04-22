import {Component, OnInit} from '@angular/core';
import {Media} from "../media";
import {HttpClient} from "@angular/common/http";
import {Location} from "@angular/common";
import {LocalService} from "../local.service";
import {Manga, MangaService} from "../manga.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {

  mangas: Manga[] = [];
  dataLoaded = false;
  p: number = 1;
  count: number = 18;
  maxCount: number | any;
  itemsPerPage: number = 10; // Number of items to display per page
  totalItems: number | any; // Total number of items
  pId: number | any;
  apiNum: number | any;
  apiUrl = 'https://api.jikan.moe/v4/manga'; // Assuming this is the base API URL
  requestInterval = 1000 / 3;
  mangaData: any[] = [];
  public ratingNumber: string|any;
  constructor(private mangaService: MangaService, private router: Router, private httpclient: HttpClient) {
  }

  ngOnInit(): void {

    this.mangaService.getMangaData();
    this.mangaData = this.mangaService.mangaData;
    this.getMostPopularMangas();



  }





  getMostPopularMangas() {
    this.mangaService
      .getMostPopularMangas()
      .subscribe((response) => (this.mangas = response.data), null, () => {
        console.log(this.mangas)


      });
    this.dataLoaded = true;
    console.log(this.mangas)



  }


  handleButtonClick(mangaId:number) {

    this.router.navigate(['/manga', mangaId]);
  }
}
