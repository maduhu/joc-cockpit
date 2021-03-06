import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ToasterConfig} from 'angular2-toaster';
import { Router } from '@angular/router';
declare const $;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {

  public config: ToasterConfig = new ToasterConfig({
    positionClass: 'toast-top-center',
    limit: 2
  });

  constructor(public translate: TranslateService, private router: Router) {
    this.getTranslate();
    AppComponent.themeInit();
    if (window.location.href) {
      this.router.navigate([window.location.href.substring(window.location.href.lastIndexOf('/'))]);
    }
  }

  private getTranslate() {
    const locales = ['en', 'fr', 'de', 'ja'];
    let lang = localStorage.$SOS$LANG || navigator.language;
    if (locales.indexOf(lang) <= -1) lang = 'en';
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
  }

  static themeInit() {
    if (localStorage.$SOS$THEME != null) {
      $('#style-color').attr('href', './styles/' + window.localStorage.$SOS$THEME + '-style.css');
    }
  }

}
