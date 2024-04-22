import { Component } from '@angular/core';
import {ListResponseModel, Manga, MangaService} from "../manga.service";

@Component({
  selector: 'app-browse-manga',
  templateUrl: './browse-manga.component.html',
  styleUrls: ['./browse-manga.component.css']
})
export class BrowseMangaComponent {
  mangas: Manga[] = [];
  currentPage = 1;
  itemsPerPage = 1;
  totalItems = 0;

  constructor(private mangaService: MangaService) {}

  ngOnInit(): void {
    this.getMostPopularMangas();
  }

  getMostPopularMangas(page: number = 1) {
    this.mangaService.getMangas2(page, this.itemsPerPage).subscribe(
      (response) => {
        this.mangas = response.data;
        this.totalItems = response.data.length; // Update totalItems with the total count from the response
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.getMostPopularMangas(page);
    }
  }

}


