import {Component, ElementRef, ViewChild} from '@angular/core';
import {Manga, MangaService} from "../manga.service";

@Component({
  selector: 'app-topmanga',
  templateUrl: './topmanga.component.html',
  styleUrls: ['./topmanga.component.css']
})
export class TopmangaComponent {
  currentIndex: number = 0;
  mangas: Manga[] = [];
  p: number = 1;
  count: number = 13;
  maxCount: number | any;
  itemsPerPage: number = 10;



  public constructor(private mangaService:MangaService) {

  }

  ngOnInit(): void {

    this.getMostPopularMangas();


  }

  @ViewChild('cardsList') cardsList!: ElementRef;

  scrollCards(direction: 'left' | 'right'): void {
    const cards = this.cardsList.nativeElement;
    const scrollAmount = direction === 'left' ? -290+5 : 282-7;
    cards.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }


  getMostPopularMangas(): void {
    this.mangaService.getMostPopularMangas().subscribe(response => {
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
