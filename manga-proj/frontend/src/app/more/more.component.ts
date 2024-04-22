import {Component, ElementRef, ViewChild} from '@angular/core';
import {Manga, MangaService} from "../manga.service";

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.css']
})
export class MoreComponent {
  mangas: Manga[] = [];
  p: number = 1;
  count: number = 16;
  maxCount: number | any;
  itemsPerPage: number = 10;



  public constructor(private mangaService:MangaService) {

  }

  ngOnInit(): void {

    this.getMostPopularMangas();


  }




  getMostPopularMangas(): void {
    this.mangaService.GetMostLightNovels().subscribe(response => {
      this.mangas = response.data;

      // Find the manga with the highest score
      const mangaWithHighestScore = this.mangas.reduce((prev, current) => {
        return (prev.score > current.score) ? prev : current;
      });

      console.log('Manga with highest score:', mangaWithHighestScore);
    }, error => {
      console.error('Error fetching most popular mangas:', error);
    });
  }
}
