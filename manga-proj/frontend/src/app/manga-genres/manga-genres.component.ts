import { Component } from '@angular/core';
import {ListResponseModel, Manga, MangaService} from "../manga.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-manga-genres',
  templateUrl: './manga-genres.component.html',
  styleUrls: ['./manga-genres.component.css']
})
export class MangaGenresComponent {
  genre: string = '';
  mangas: any[] = []; // Replace any[] with the actual type of your manga data
  currentPage = 1;
  itemsPerPage = 1;
  totalItems = 0;
  constructor(private route: ActivatedRoute, private mangaService: MangaService) { }



  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.genre = params['genre'];
      this.fetchMangaByGenre(this.genre, this.currentPage);
    });
  }

  fetchMangaByGenre(genre: string, page: number): void {
    this.mangaService.getMangByGenre(this.genre, this.currentPage, this.itemsPerPage).subscribe(
      (response) => {
        this.mangas = response.data;
        this.totalItems = response.data.length; // Update totalItems with the total count from the response
      },
      (error) => {
        console.error('Error fetching manga by genre:', error);
      }

  );
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.fetchMangaByGenre(this.genre,page);
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
}
