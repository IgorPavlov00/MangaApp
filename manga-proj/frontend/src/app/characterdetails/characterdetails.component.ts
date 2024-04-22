import { Component } from '@angular/core';
import { MangaService, ResponseModel } from "../manga.service";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";

interface Voice {
  language: string;
  person: {
    mal_id: number;
    url: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
    name: string;
  };
}


export interface Character {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
    };
  };
  name: string;
  name_kanji: string;
  nicknames: string[];
  favorites: number;
  about: {
    Age: string;
    Birthday: string;
    Height: string;
    Clan: string;
    Hair: string;
    Eyes: string;
    Grade: string;
    Abilities: string;
  };
  voices: Voice[];
  anime: any[]; // Update this according to your actual data structure
  manga: any[]; // Update this according to your actual data structure
  traits?: string[];
  abilities?: string[]; // List of abilities
  powers?: string[];
  // Add any other properties you want to use
}

@Component({
  selector: 'app-characterdetails',
  templateUrl: './characterdetails.component.html',
  styleUrls: ['./characterdetails.component.css']
})
export class CharacterdetailsComponent {
  character: Character | undefined;
  characters: any[] = [];
  recommendations: any[] = [];
  characterSearchResults: any[] = [];
  characterDetails: any;
  query: string = '';
  characterId!: number;
  mangaResults: any[] | undefined;
  characterManga: any = { data: { characters: [] } };
  constructor(private animeService: MangaService, private route: ActivatedRoute, private location: Location) {

  }

  ngOnInit(): void {
    this.animeService.getCharacterDetails(this.route.snapshot.params['id']).subscribe(
      (characterDetails: any) => {
        this.character = characterDetails.data;
        console.log(this.character)
      },
      (error: any) => {
        console.error('Error fetching character details:', error);
      }
    );
  }
}
