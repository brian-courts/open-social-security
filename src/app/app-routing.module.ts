import { NgModule }             from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { AboutComponent } from './staticpages/about/about.component';
import { ContactComponent } from './staticpages/contact/contact.component';
import { LegalComponent } from './staticpages/legal/legal.component';
import { ArticlesHomeComponent } from './staticpages/articles-home/articles-home.component';

const routes: Routes = [
  // { path: '', loadChildren: './staticpages/staticpages.module#StaticPagesModule' },
            //scully is working with these four below
            { path: 'articles', pathMatch:'full', component: ArticlesHomeComponent },
            { path: 'about', component: AboutComponent },
            { path: 'contact', component: ContactComponent },
            { path: 'legal', component: LegalComponent },

            ///this is old setup with Angular Universal
              // { path: 'about/.', component: AboutComponent},
              //   { path: 'about', redirectTo: 'about/.', pathMatch: 'full'},
              // { path: 'contact/.', component: ContactComponent},
              //   { path: 'contact', redirectTo: 'contact/.', pathMatch: 'full'},
              // { path: 'legal/.', component: LegalComponent},
              //   { path: 'legal', redirectTo: 'legal/.', pathMatch: 'full'},
              // { path: 'articles/.', pathMatch: 'full', component: ArticlesHomeComponent },
              //   { path: 'articles', redirectTo: 'articles/.', pathMatch: 'full'},
              // { path: 'articles/8-return/.', component: DelayingSocialSecurity8ReturnComponent },
              //   { path: 'articles/8-return', redirectTo: 'articles/8-return/.', pathMatch: 'full'},
              // { path: 'articles/social-security-planning-similar-earnings-history/.', component: SimilarPIAsComponent },
              //   { path: 'articles/social-security-planning-similar-earnings-history', redirectTo: 'articles/social-security-planning-similar-earnings-history/.', pathMatch: 'full'},
              // { path: 'articles/spousal-benefit-calculation/.', component: SpousalBenefitCalculationComponent },
              //   { path: 'articles/spousal-benefit-calculation', redirectTo: 'articles/spousal-benefit-calculation/.', pathMatch: 'full'},
              // { path: 'articles/child-in-care-spousal/.', component: ChildInCareSpousalComponent },
              //   { path: 'articles/child-in-care-spousal', redirectTo: 'articles/child-in-care-spousal/.', pathMatch: 'full'},
              // { path: 'articles/calculate-retirement-benefit/.', component: CalculateRetirementBenefitComponent },
              //   { path: 'articles/calculate-retirement-benefit', redirectTo: 'articles/calculate-retirement-benefit/.', pathMatch: 'full'},
              // { path: 'articles/retirement-and-spousal/.', component: SpousalWithRetirementComponent },
              //   { path: 'articles/retirement-and-spousal', redirectTo: 'articles/retirement-and-spousal/.', pathMatch: 'full'},

              { path: 'articles', loadChildren: () => import('./articles/articles.module').then(m => m.ArticlesModule) },
              { path: '', pathMatch:'full', component: HomeComponent },
  //{ path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { initialNavigation: 'enabled' }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {



}