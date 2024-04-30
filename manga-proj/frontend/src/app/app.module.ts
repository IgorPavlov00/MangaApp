import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { MangaComponent } from "./manga/manga.component";

import { AnimeModule } from './anime/anime.module';
import {Router, RouterModule} from "@angular/router";
import {HttpClientModule} from "@angular/common/http";
import { SectionComponent } from './section/section.component';
import { MangaDetailsComponent } from './manga-details/manga-details.component';
import {NgxPaginationModule} from "ngx-pagination";
import { NavbarmangaComponent } from './navbarmanga/navbarmanga.component';
import { BrowseMangaComponent } from './browse-manga/browse-manga.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {LoginComponent} from "./login/login.component";
import { ProfilComponent } from './profil/profil.component';
import { StarComponent } from './star/star.component';
import { RegistrationSuccessComponent } from './registration-success/registration-success.component';
import {IgxCarouselModule, IgxSliderModule} from "igniteui-angular";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BannerComponent } from './banner/banner.component';
import { ComicComponent } from './comic/comic.component';
import {MatSliderModule} from "@angular/material/slider";
import { TopmangaComponent } from './topmanga/topmanga.component';
import { CategoriesComponent } from './categories/categories.component';
import {PaginateComponent} from './paginate/paginate.component';
import { FooterComponent } from './footer/footer.component';
import { CharacterdetailsComponent } from './characterdetails/characterdetails.component';
import { MoreComponent } from './more/more.component';
import {ToastrModule} from "ngx-toastr";
import { MangaGenresComponent } from './manga-genres/manga-genres.component';
import { FilterComponent } from './filter/filter.component';
import {ScrollTopModule} from "primeng/scrolltop";








@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    MangaComponent,
    SectionComponent,
    MangaDetailsComponent,
    NavbarmangaComponent,
    BrowseMangaComponent,
    LoginComponent,
    ProfilComponent,
    StarComponent,

    RegistrationSuccessComponent,
    BannerComponent,
    ComicComponent,
    TopmangaComponent,
    CategoriesComponent,
    PaginateComponent,
    FooterComponent,
    CharacterdetailsComponent,
    MoreComponent,
    MangaGenresComponent,
    FilterComponent,


  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HttpClientModule,
    NgxPaginationModule,
    BrowserAnimationsModule,
    FormsModule,
    IgxCarouselModule,
    IgxSliderModule,
    MatSliderModule,
    ToastrModule.forRoot(),
    ReactiveFormsModule,
    ScrollTopModule


  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
