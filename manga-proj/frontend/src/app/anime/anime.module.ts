import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HeroBannerComponent} from './components/hero-banner/hero-banner.component';
import {TopNListComponent} from './components/top-nlist/top-nlist.component';
import {BasicNavBarComponent} from './components/basic-nav-bar/basic-nav-bar.component';
import {BasicFooterComponent} from './components/basic-footer/basic-footer.component';
import {BasicHomePageComponent} from './pages/basic-home-page/basic-home-page.component';
import {RouterModule} from '@angular/router';
import {AboutComponent} from './components/about/about.component';
import {BrowseComponent} from './components/browse/browse.component';
import {BasicAnimePagesComponent} from './pages/basic-anime-pages/basic-anime-pages.component';
import {HttpClientModule} from "@angular/common/http";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    HeroBannerComponent,
    TopNListComponent,
    BasicNavBarComponent,
    BasicFooterComponent,
    BasicHomePageComponent,
    AboutComponent,
    BrowseComponent,
    BasicAnimePagesComponent
  ],
    imports: [
        CommonModule,
        RouterModule,
        HttpClientModule,
        FormsModule
    ]
})
export class AnimeModule {
}
