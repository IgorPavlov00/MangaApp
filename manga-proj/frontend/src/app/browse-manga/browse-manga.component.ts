import { Component } from '@angular/core';
import {ListResponseModel, Manga, MangaService} from "../manga.service";
import {FormBuilder, FormGroup} from "@angular/forms";

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
  searchForm: FormGroup;
  allMangas: Manga[] = []; // Separate list to store all fetched mangas
  filteredMangas: Manga[] = [];

  constructor(private mangaService: MangaService,private formBuilder: FormBuilder) {
    this.searchForm = this.formBuilder.group({
      search: [''],
      genre: [''],
      chapter: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.getMostPopularMangas();
  }
  search() {
    const searchValue = this.searchForm.get('search')?.value?.toLowerCase() || '';
    const genreValue = this.searchForm.get('genre')?.value?.toLowerCase() || '';

    // Perform filtering based on searchValue and genreValue
    this.mangas = this.mangas.filter(manga => {
      const titleMatches = manga.title.toLowerCase().includes(searchValue);

      return titleMatches;
    });
  }

  // This method will be called whenever the form value changes
  onFormValueChanges() {
    this.search(); // Call the search meth  od whenever the form value changes
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
      this.search();
    }
  }

}


