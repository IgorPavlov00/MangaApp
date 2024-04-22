import {Component} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {TopAnimeItem} from "../../model/top-anime-item";

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.css']
})
export class BrowseComponent {
  apiUrl = 'https://api.jikan.moe/v4/anime'; // API URL to fetch paginated data
  currentPage = 1;
  data: TopAnimeItem[] = [];
  lastVisiblePage: number = 0;
  totalPages: number[] = [];
  filters: string[] = [];
  sorts: string[] = [];

  constructor(private http: HttpClient) {
    let url = `${this.apiUrl}?sfw&order_by=score&sort=desc&page=${this.currentPage}`;
    this.http.get(url).subscribe((response: any) => {
      const totalItems = response.pagination.items.total;
      const perPage = response.pagination.items.per_page;
      this.setLastVisiblePage(Math.ceil(totalItems / perPage));

      this.totalPages = this.range(1, this.lastVisiblePage);
      this.fetchData();
      console.log(response)
    });
  }

  fetchFiltersSorts() {

  }

  ngOnInit(): void {
  }

  fetchData(): void {
    this.data = [];
    let url = `${this.apiUrl}?sfw&order_by=score&sort=desc&page=${this.currentPage}`;
    this.http.get(url).subscribe((response: any) => {
      for (const item of response.data) {
        this.addItemToData(item);
      }
    });
  }

  setLastVisiblePage(page: number) {
    this.lastVisiblePage = page;
  }

  addItemToData(item: any): void {
    var temp = new TopAnimeItem();
    temp.title = item.title;
    temp.image = item.images.jpg.large_image_url;
    this.data.push(temp);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchData();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages.length) {
      this.currentPage++;
      this.fetchData();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.fetchData();
  }

  range(start: number, end: number, step: number = 1): number[] {
    const result = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  }

  getPageRange(): any[] {
    const rangeSize = 3;
    const rangeStart = Math.max(1, this.currentPage - Math.floor(rangeSize / 2));
    const rangeEnd = Math.min(rangeStart + rangeSize - 1, this.totalPages.length);

    let pageRange: any[] = [];

    if (rangeStart > rangeSize) {
      for (let i = 1; i <= 3; i++) {
        pageRange.push(i);
      }
      pageRange.push("...");
    }
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageRange.push(i);
    }
    pageRange.push("...");
    for (let i = this.totalPages.length - 1; i <= this.totalPages.length; i++) {
      pageRange.push(i);
    }
    return pageRange;
  }

}
