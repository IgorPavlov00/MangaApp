import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import {Manga, MangaService, ResponseModel} from "../manga.service";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {Location} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {UserService} from "../user.service";
import {LocalService} from "../local.service";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-manga',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.css'],

})
export class SectionComponent implements OnInit {

  mangaId: string | undefined;

  userReview: any = { comment: '', rating: 0 }; // Initialize an empty user review object
  isLoggedIn: boolean = false;
  manga: ResponseModel | undefined;
  reviews: any[] = [];
  recommendations: any[] = [];
  characterSearchResults: any[] = [];
  characterDetails: any;
  query: string = '';
  characterId!: number ;
  mangaResults: any[] | undefined;
  characterManga: any = { data: { characters: [] } };
  private pageReloaded: boolean = false;
  private hasReloaded: boolean = false;
  constructor(private animeService: MangaService,
              private route: ActivatedRoute,
              private location: Location,
              private http: HttpClient,
              private userService: UserService,
              private auth: LocalService,
              private toast: ToastrService,
              private router: Router) {


  }

  ngOnInit(): void {
    this.getAnime();
    this.location.replaceState(this.location.path());
    this.getCharacterManga(this.route.snapshot.params['id']);
    this.animeService.getMangaReviews(this.route.snapshot.params['id']).subscribe(
      reviews => {
        this.reviews = reviews.data;
        sessionStorage.setItem('reviews', JSON.stringify(this.reviews));
        console.log(this.reviews);
      },
      error => {
        console.error('Error fetching manga reviews:', error);
      }
    );
    this.isLoggedIn = this.auth.isLoggedIn();
    this.getmangaRecommendations(); // Call getMangaRecommendations here

    if (this.hasReloaded) {
      this.reloadPage();
      this.hasReloaded = true;
    }
  }
  reloadPage(): void {
    this.hasReloaded=true;
    setTimeout(() => {
      window.location.reload();

    }, 1000); // Adjust the delay if needed
  }

  getmangaRecommendations() {
    this.animeService.getMangaReccommendations(this.route.snapshot.params['id']).subscribe(recommendations => {
      this.recommendations = recommendations.data;
      console.log(this.recommendations)
    }, error => {
      console.error('Error fetching manga recommendations:', error);
    });
  }

  getAnime(): void {
    this.location.replaceState(this.location.path());
    const id = +this.route.snapshot.params['id'];
    this.animeService.getManga(id).subscribe(
      (manga) => {
        this.manga = manga;
        this.getCharacterManga(id); // Call getCharacterManga after manga data is fetched
        console.log(this.manga?.data.chapters);
        console.log(this.manga);
        this.location.replaceState(this.location.path());
      },
      error => {
        console.error('Error fetching manga:', error);
      }
    );
    this.location.replaceState(this.location.path());
  }

  addToUserList(): void {
    // Check if this.manga is defined and this.manga.data is defined and not null
    if (this.manga && this.manga.data !== undefined && this.manga.data !== null) {
      const mangaId = this.manga.data.mal_id;
      if (mangaId) {
        this.userService.getLoggedInUser().subscribe(
          (user: any) => {
            const userId = user.id;
            const requestPayload = {
              userId: userId,
              mangaId: mangaId,
             // Add a null check for this.manga.data
            };
            this.toast.info("Manga added to user list");
            console.log('Request payload:', requestPayload);
            this.userService.addMangaToUser(requestPayload).subscribe(
              (response: any) => {
                console.log('Manga added to user list:', response);
                // Optionally, you can display a success message or update the UI
              },
              (error: any) => {
                console.error('Error adding manga to user list:', error);
                // Handle error
              }
            );
          },
          (error: any) => {
            console.error('Error getting logged-in user:', error);
            // Handle error
          }
        );
      }
    } else {
      console.error('Manga details are not available or null.');
    }
  }








  getCharacterManga(malId: number): void {
    this.animeService.getCharacterManga(malId).subscribe(
      (data: any) => {
        const mainCharacters = data.data.filter((character: any) => character);

        // Sort characters by popularity
        mainCharacters.sort((a: any, b: any) => b.character.popularity - a.character.popularity);

        // Select the first seven characters
        const firstSevenCharacters = mainCharacters.slice(0, 7);

        this.characterManga = { data: { characters: firstSevenCharacters } };
        console.log('Main Characters:', this.characterManga);

        // Update the URL without refreshing the page
        this.location.replaceState(this.location.path());

        // Store characterManga data in localStorage
        localStorage.setItem('characterManga', JSON.stringify(this.characterManga));
      },
      error => {
        console.error('Error fetching character manga:', error);
        this.characterManga = { data: { characters: [] } };
        sessionStorage.setItem('characterManga', JSON.stringify(this.characterManga));
      }
    );
  }

  isExpanded: boolean = false;
  expandedReviewIndex: number | null = null; // Track the index of the expanded review
  expandedSynopsis: boolean = false;

  toggleSynopsisExpansion(event: MouseEvent) {
    event.preventDefault();
    this.expandedSynopsis = !this.expandedSynopsis;
  }

  toggleReviewExpansion(event: MouseEvent, index: number): void {
    event.preventDefault(); // Prevent default navigation behavior
    this.expandedReviewIndex = this.expandedReviewIndex === index ? null : index;
  }
  scroll(el: HTMLElement) {
    el.scrollIntoView({behavior: 'smooth'});
  }





}
