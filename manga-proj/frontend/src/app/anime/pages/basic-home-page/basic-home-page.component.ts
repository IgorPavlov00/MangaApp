import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TopAnimeItem} from "../../model/top-anime-item";

@Component({
  selector: 'app-basic-home-page',
  templateUrl: './basic-home-page.component.html',
  styleUrls: ['./basic-home-page.component.css']
})
export class BasicHomePageComponent implements OnInit {
  trendingAnime: TopAnimeItem[] = [];
  upcomingAnime: TopAnimeItem[] = [];
  seasonalAnime: TopAnimeItem[] = [];
  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.http.get('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10')
      .subscribe((response: any) => {
        for (const item of response.data) {
          this.addItemToTrending(item);
        }
      });

    this.http.get('https://api.jikan.moe/v4/seasons/now?limit=10')
      .subscribe((response: any) => {
        for (const item of response.data) {
          this.addItemToSeasonal(item);
        }
      });

    this.http.get('https://api.jikan.moe/v4/top/anime?filter=upcoming&limit=10')
      .subscribe((response: any) => {
        for (const item of response.data) {
          this.addItemToUpcoming(item);
        }
      });

    console.log(this.trendingAnime)
    console.log(this.upcomingAnime)
    console.log(this.seasonalAnime)
  }

  addItemToTrending(item: any): void {
    var temp = new TopAnimeItem();
    temp.title = item.title;
    temp.image = item.images.jpg.image_url;
    this.trendingAnime.push(temp);
  }

  addItemToUpcoming(item: any): void {
    var temp = new TopAnimeItem();
    temp.title = item.title;
    temp.image = item.images.jpg.image_url;
    this.upcomingAnime.push(temp);
  }

  addItemToSeasonal(item: any): void {
    var temp = new TopAnimeItem();
    temp.title = item.title;
    temp.image = item.images.jpg.image_url;
    this.seasonalAnime.push(temp);
  }

}
