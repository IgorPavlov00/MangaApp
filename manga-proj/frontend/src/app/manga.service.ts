import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {
  catchError,
  concat,
  forkJoin,
  map,
  mergeMap,
  Observable,
  reduce,
  ReplaySubject,
  shareReplay,
  tap, throwError,
  timer
} from "rxjs";
import {MangaComponent} from "./manga/manga.component";

export interface Manga {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  characters:[{
    mal_id: number;
    url: string;
    images: {
      "jpg": {
        image_url: string;
        small_image_url: string;
      },
      webp: {
        "image_url": string;
        small_image_url: string;
      }
    },
    name: string;

  role: string;}
];
  trailer: {
    youtube_id: string;
    url: string;
    embed_url: string;
  };
  approved: boolean;
  titles: string[];
  title: string;
  title_english: string;
  title_japanese: string;
  title_synonyms: string[];
  type: string;
  source: string;
  episodes: number;
  status: string;
  airing: boolean;
  chapters:string;
  volumes:string;
  aired: {
    from: string;
    to: string;
    prop: {
      from: {
        day: number;
        month: number;
        year: number;
      };
      to: {
        day: number;
        month: number;
        year: number;
      };
    };
    string: string;
  };

  duration: string;
  rating: string;
  score: number;
  scored_by: number;
  rank: number;
  popularity: number;
  members: number;
  favorites: number;
  synopsis: string;
  background: string;
  season: string;
  year: number;
  broadcast: {
    day: string;
    time: string;
    timezone: string;
    string: string;
  };
  authors: [
    {
      mal_id: number;
      type: string;
      name: string;
    }];
  producers: [
    {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }
  ];
  licensors: [
    {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }
  ];
  studios: [
    {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }
  ];
  genres: [
    {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }
  ];
  explicit_genres: [
    {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }
  ];
  themes: [
    {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }
  ];
  demographics: [
    {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }
  ];
  relations: [
    {
      relation: string;
      entry: [
        {
          mal_id: number;
          type: string;
          name: string;
          url: string;
        }
      ];
    }
  ];
  theme:{
    openings:[
      string
    ];
    endings:[
      string
    ];
  }
  external:[
    {
      name:string;
      url:string;
    }
  ]
  streaming:[
    {
      name:string;
      url:string;
    }
  ]
}
export interface ListResponseModel<T>{
  data:T[];
}
export interface Pagination{
  pagination:{
    last_visible_page:number;
    has_next_page:boolean;
    current_page:number;
    items:{
      count:number;
      total:number;
      per_page:number;
    }

  }
}
export interface ResponseModel{
  data:Manga
}
interface PaginationModel {
  last_visible_page: number;
  pagination: any;
}
@Injectable({
  providedIn: 'root'
})
export class MangaService {

  private mechaCache$: ReplaySubject<ListResponseModel<Manga>> = new ReplaySubject<ListResponseModel<Manga>>(1);

  apiUrl:string="https://api.jikan.moe/v4/manga";
  character:string="https://api.jikan.moe/v4/characters";
  mostpopular:string="https://api.jikan.moe/v4/manga?order_by=popularity";
  action:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=1&limit=25";
  advanture:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=2&limit=25";
  shojo:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=25";
  fantasy:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=10";
  romance:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=22";
  comedy:string="https://api.jikan.moe/v4/manga?genres=4";
  shounen:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=27";
  seinen:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=41";
  supernatural:string="https://api.jikan.moe/v4/manga?genres=37";
  mystery:string="https://api.jikan.moe/v4/manga?genres=7";
  horror:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=14";
  sport:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=30";
  mecha:string="https://api.jikan.moe/v4/manga?order_by=popularity&genres=18";
  military:string="https://api.jikan.moe/v4/manga?genres=38";
  psychological:string="https://api.jikan.moe/v4/manga?genres=40";
  private characters = 'https://api.jikan.moe/v4/manga';
  private pop = 'https://api.jikan.moe/v4/manga?order_by=popularity';
  private light_novel = 'https://api.jikan.moe/v4/top/manga?type=lightnovel';
  requestInterval = 4000;
  mangaData: any[] = [];
  private ListResponesModel: Manga | undefined;

  constructor(private httpclient:HttpClient) { }

  getMangaReviews(mangaId: number): Observable<any> {
    const url = `${this.apiUrl}/${mangaId}/reviews`;
    return this.httpclient.get<any>(url).pipe(
      catchError(error => {
        console.error('Error fetching manga reviews:', error);
        return throwError(error);
      })
    );
  }

  getMangaReccommendations(mangaId: number): Observable<any> {
    const url = `${this.apiUrl}/${mangaId}/recommendations`;
    return this.httpclient.get<any>(url).pipe(
      catchError(error => {
        console.error('Error fetching manga reviews:', error);
        return throwError(error);
      })
    );
  }


  getMangaData(): Observable<ListResponseModel<Manga>> {
    const totalPages = 3;
    const mangaPerPage = 25;

    for (let i = 1; i <= Math.ceil(totalPages / mangaPerPage); i++) {
      const requestUrl = `${this.apiUrl}?page=${i}&limit=${mangaPerPage}`;

      timer((i - 1) * this.requestInterval).pipe(
        mergeMap(() => this.httpclient.get<ListResponseModel<Manga>>(requestUrl))
      ).subscribe((response: any) => {
        if (response && response.results && Array.isArray(response.results)) {
          this.mangaData.push(...response.results); // Store the manga data

        }
      });
    }
    return this.httpclient.get<ListResponseModel<Manga>>(this.apiUrl);
  }

  searchCharacters(query: string, page: number): Observable<any> {
    const characterSearchUrl = `${this.apiUrl}/search/character`;
    const fullUrl = `${characterSearchUrl}?q=${query}&page=${page}`;
    return this.httpclient.get(fullUrl).pipe(
      catchError((error: any) => {
        throw error; // You may want to handle errors differently
      })
    );
  }

  // Method to fetch character data by ID
  getCharacterManga(characterId: number): Observable<any> {
    const url = `${this.characters}/${characterId}/characters`;
    return this.httpclient.get<any>(url);
  }

  getMangas(): Observable<ListResponseModel<Manga>> {
    const totalPages = 60;
    const mangaPerPage = 25;

    const requests: Observable<ListResponseModel<Manga>>[] = [];

    for (let i = 1; i <= Math.ceil(totalPages / mangaPerPage); i++) {
      const requestUrl = `${this.mostpopular}?page=${i}&limit=${mangaPerPage}`;
      requests.push(this.httpclient.get<ListResponseModel<Manga>>(requestUrl));
    }

    return concat(...requests).pipe(
      reduce((mergedResponse: ListResponseModel<Manga>, response: ListResponseModel<Manga>) => {
        mergedResponse.data.push(...response.data);
        return mergedResponse;
      }, { data: [] as Manga[] })
    );
  }

  getMangas2(page: number, limit: number): Observable<ListResponseModel<Manga>> {
    const offset = (page - 1) * limit;
    const url = `${this.pop}&page=${page}`;
    return this.httpclient.get<ListResponseModel<Manga>>(url);
  }

  getMangByGenre(genre: string, page: number, limit: number): Observable<ListResponseModel<Manga>> {
    const offset = (page - 1) * limit;
    switch (genre.toLowerCase()) {
      case 'action':
        // return this.getActionMangas(page, limit);
        const url1 = `${this.action}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url1);
      case 'mecha':
        const url2 = `${this.mecha}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url2);
      case 'sport':
        const url3 = `${this.sport}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url3);
      case 'fantasy':
        const url4 = `${this.fantasy}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url4);
      case 'romance':
        const url5 = `${this.romance}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url5);
      case 'seinen':
        const url6 = `${this.seinen}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url6);
      case 'shounen':
        const url7 = `${this.shounen}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url7);
      case 'horror':
        const url8 = `${this.horror}&page=${page}`;
        return this.httpclient.get<ListResponseModel<Manga>>(url8);

      default:
        throw new Error(`Invalid genre: ${genre}`);
    }

  }


  getMostPopularMangas():Observable<ListResponseModel<Manga>>{
    // const params = new HttpParams()
    //   .set('genres', '30') // Set the 'genres' parameter to '30' for sports manga
    //   .set('order_by', 'asc'); // Set the 'order_by' parameter to 'asc' for ascending order

    return this.httpclient.get<ListResponseModel<Manga>>(this.mostpopular);
  }


  getManga(id:number):Observable<ResponseModel>{
    const url = `${this.apiUrl}/${id}`;
    console.log(url);
    return this.httpclient.get<ResponseModel>(url).pipe();
  }


  getCharacterDetails(characterId: number): Observable<any> {
    const url = `${this.character}/${characterId}/full`;
    return this.httpclient.get<any>(url);
  }

  GetMostLightNovels():Observable<ListResponseModel<Manga>>{


    return this.httpclient.get<ListResponseModel<Manga>>(this.light_novel);
  }

  searchMangas(name: string, genre: string): Observable<ListResponseModel<Manga>> {
    // Build query parameters for search
    let params = new HttpParams();
    if (name) {
      params = params.append('name', name);
    }
    if (genre) {
      params = params.append('genre', genre);
    }

    // Make API call to search mangas
    return this.httpclient.get<ListResponseModel<Manga>>(`${this.apiUrl}/mangas/search`, { params });
  }
}


