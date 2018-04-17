import { Module, ModuleWithProviders } from '@angular/core';
import { ScrollPositionService } from './Services';

@Module({})
export class ScrollPositionModule {
    static forRoot(): ModuleWithProviders {
        return {ngModule: ScrollPositionModule, providers: [ScrollPositionService]};
    }
}