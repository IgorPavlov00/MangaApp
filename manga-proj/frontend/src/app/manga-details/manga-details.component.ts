import { Component } from '@angular/core';
import {MangaService, ResponseModel} from "../manga.service";
import {ActivatedRoute} from "@angular/router";
import { Location } from '@angular/common';
@Component({
  selector: 'app-manga-details',
  templateUrl: './manga-details.component.html',
  styleUrls: ['./manga-details.component.css']
})
export class MangaDetailsComponent {
  manga: ResponseModel | undefined;
  characterSearchResults: any[] = [];
  characterDetails: any;
  query: string = '';
  characterId!: number ;
  mangaResults: any[] | undefined;
  characterManga: any = { data: { characters: [] } };
  constructor(private animeService: MangaService, private route: ActivatedRoute, private location: Location) {

  }

  ngOnInit(): void {
    this.getAnime();
  }

  getAnime(): void {
    const id = +this.route.snapshot.params['id'];
    this.animeService.getManga(id).subscribe(
      (manga) => {
        this.manga = manga;
        this.getCharacterManga(id);
        console.log(this.manga?.data.chapters);
      },
      error => {
        console.error('Error fetching manga:', error);
      }
    );
  }

  getCharacterManga(malId: number): void {
    this.animeService.getCharacterManga(malId).subscribe(
      (data: any) => {
        // Filter main characters
        const mainCharacters = data.data.filter((character: any) => character);
        // Assign main characters to characterManga
        const firstSixCharacters = mainCharacters.slice(0, 7);
        // Assign first 6 characters to characterManga
        this.characterManga = { data: { characters: firstSixCharacters } };
        console.log('Main Characters:', this.characterManga);
      },
      error => {
        console.error('Error fetching character manga:', error);
        // Initialize characterManga as an empty array
        this.characterManga = { data: { characters: [] } };
      }
    );
  }



}
