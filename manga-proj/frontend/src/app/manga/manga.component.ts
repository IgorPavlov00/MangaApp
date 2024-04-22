import {Component, ElementRef, EventEmitter, Output, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import {Manga, MangaService} from "../manga.service";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";

import {map, mergeMap, timer} from "rxjs";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {ViewportScroller} from "@angular/common";


@Component({
  selector: 'app-manga',
  templateUrl: './manga.component.html',
  styleUrls: ['./manga.component.css'],


  animations: [
    trigger('slideAnimation', [
      state('left', style({ transform: 'translateX(-100%)' })),
      state('right', style({ transform: 'translateX(100%)' })),
      transition('* => left', animate('300ms ease-in-out')),
      transition('* => right', animate('300ms ease-in-out'))
    ])
  ]
})

export class MangaComponent {

  mangas: Manga[] = [];
  dataLoaded = false;
  p: number = 1;
  count: number = 12;
  maxCount: number | any;
  itemsPerPage: number = 10; // Number of items to display per page

  slideWidthPercentage = 100;
   apiUrl = 'https://api.mangadex.org/manga?title=naruto'; // Assuming this is the base API URL
  requestInterval = 1000 / 3;
  mangaData: any[] = [];
  mangaImages: any[] = [];
  chapterImages: any[] | undefined; // This is where you'll store the images
  chapters: any[] = [];
  constructor(private mangaService: MangaService, private router: Router, private httpclient: HttpClient,private viewportScroller: ViewportScroller) {
  }

  totalItems: number|any; // Total number of items
  pId:number|any;
  apiNum:number|any;
  slides!: NodeListOf<Element>;
  currentIndex: number = 0;
  mangaList = [
    { id: 116778, title: 'Chainsaw Man', imageUrl: 'assets/img/manga8.jpg', description: 'Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts.' },
    { id: 11, title: 'NARUTO', imageUrl: 'assets/img/manga2.jpg', description: 'The story delves into Naruto\'s growth as a ninja, his quest for recognition, and his journey to protect his loved ones and the village. Along the way, Naruto  uncovers dark secrets, and faces the consequences of his choices.' },
    { id: 12, title: 'BLEACH', imageUrl: 'assets/img/manga3.jpg', description: 'The story centers around Ichigo Kurosaki, a teenager with the ability to see ghosts. One day, he unintentionally obtains the powers of a Soul Reaper, responsible for protecting the living world from malevolent spirits known as Hollows. ' },
    { id: 114745, title: 'BLUE LOCK', imageUrl: 'assets/img/manga4.jpg', description: 'The protagonist, Yoichi Isagi, is a talented high school soccer player who gets recruited by Blue Lock. He finds himself in a unique training facility, where 300 other skilled strikers from across the country have also been selected. ' },
    { id: 86337, title: 'BLACK CLOVER', imageUrl: 'assets/img/manga5.jpg', description: 'Despite his lack of magic, Asta dreams of becoming the Wizard King, the highest-ranking mage in the kingdom. He possesses an unwavering determination and an incredible physical strength that compensates for his magical deficiency. ' },
    { id: 642, title: 'VINLAND SAGA', imageUrl: 'assets/img/manga6.jpg', description: 'Set during the Viking Age, the story follows the life of Thorfinn, a young Viking warrior seeking revenge against Askeladd, the mercenary leader who killed his father. ' },

  ];

  ngOnInit(): void {
    // this.getMangas();
    // this.mangaService.getMangaData();
    // this.mangaData = this.mangaService.mangaData;
    this.getMostPopularMangas();
    // this.slides = document.querySelectorAll(".slider li");
    // console.log('Slides:', this.slides);
    // this.showSlide(this.currentIndex);

  }
  @Output() scrollToTopEvent: EventEmitter<any> = new EventEmitter();

  scrollToTop() {
    console.log('Scroll to top button clicked');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.scrollToTopEvent.emit();
  }



  nextSlide() {
    this.currentIndex = (this.currentIndex === this.mangaList.length - 1) ? 0 : this.currentIndex + 1;
  }


  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.mangaList.length) % this.mangaList.length;
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

    this.router.navigate(['/sec', mangaId]);
  }

  goToManga(mal_id: any) {
    // this.router.navigate(['/manga', mal_id]);
    console.log('sdaasd')
  }
}













