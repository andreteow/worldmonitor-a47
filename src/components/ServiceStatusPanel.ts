
import { Panel } from './Panel';
import { t } from '@/services/i18n';
import {
  fetchServiceStatuses,
  type ServiceStatusResult as ServiceStatus,
} from '@/services/infrastructure';
import { h, replaceChildren } from '@/utils/dom-utils';

type CategoryFilter = 'all' | 'cloud' | 'dev' | 'comm' | 'ai' | 'saas';

function getCategoryLabel(category: CategoryFilter): string {
  const labels: Record<CategoryFilter, string> = {
    all: t('components.serviceStatus.categories.all'),
    cloud: t('components.serviceStatus.categories.cloud'),
    dev: t('components.serviceStatus.categories.dev'),
    comm: t('components.serviceStatus.categories.comm'),
    ai: t('components.serviceStatus.categories.ai'),
    saas: t('components.serviceStatus.categories.saas'),
  };
  return labels[category];
}

export class ServiceStatusPanel extends Panel {
  private services: ServiceStatus[] = [];
  private loading = true;
  private error: string | null = null;
  private filter: CategoryFilter = 'all';
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({ id: 'service-status', title: t('panels.serviceStatus'), showCount: false });
    void this.fetchStatus();
    this.refreshInterval = setInterval(() => this.fetchStatus(), 60000);
  }

  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    super.destroy();
  }

  private async fetchStatus(): Promise<void> {
    try {
      const data = await fetchServiceStatuses();
      if (!data.success) throw new Error('Failed to load status');

      this.services = data.services;
      this.error = null;
    } catch (err) {
      if (this.isAbortError(err)) return;
      this.error = err instanceof Error ? err.message : 'Failed to fetch';
      console.error('[ServiceStatus] Fetch error:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private setFilter(filter: CategoryFilter): void {
    this.filter = filter;
    this.render();
  }

  private getFilteredServices(): ServiceStatus[] {
    if (this.filter === 'all') return this.services;
    return this.services.filter(s => s.category === this.filter);
  }

  protected render(): void {
    if (this.loading) {
      replaceChildren(this.content,
        h('div', { className: 'service-status-loading' },
          h('div', { className: 'loading-spinner' }),
          h('span', null, t('components.serviceStatus.checkingServices')),
        ),
      );
      return;
    }

    if (this.error) {
      replaceChildren(this.content,
        h('div', { className: 'service-status-error' },
          h('span', { className: 'error-text' }, this.error),
          h('button', {
            className: 'retry-btn',
            onClick: () => { this.loading = true; this.render(); void this.fetchStatus(); },
          }, t('common.retry')),
        ),
      );
      return;
    }

    const filtered = this.getFilteredServices();
    const issues = filtered.filter(s => s.status !== 'operational');

    replaceChildren(this.content,
      this.buildSummary(filtered),
      this.buildFilters(),
      h('div', { className: 'service-status-list' },
        ...this.buildServiceItems(filtered),
      ),
      issues.length === 0 ? h('div', { className: 'all-operational' }, t('components.serviceStatus.allOperational')) : false,
    );
  }

  private buildSummary(services: ServiceStatus[]): HTMLElement {
    const operational = services.filter(s => s.status === 'operational').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    const outage = services.filter(s => s.status === 'outage').length;

    return h('div', { className: 'service-status-summary' },
      h('div', { className: 'summary-item operational' },
        h('span', { className: 'summary-count' }, String(operational)),
        h('span', { className: 'summary-label' }, t('components.serviceStatus.ok')),
      ),
      h('div', { className: 'summary-item degraded' },
        h('span', { className: 'summary-count' }, String(degraded)),
        h('span', { className: 'summary-label' }, t('components.serviceStatus.degraded')),
      ),
      h('div', { className: 'summary-item outage' },
        h('span', { className: 'summary-count' }, String(outage)),
        h('span', { className: 'summary-label' }, t('components.serviceStatus.outage')),
      ),
    );
  }

  private buildFilters(): HTMLElement {
    const categories: CategoryFilter[] = ['all', 'cloud', 'dev', 'comm', 'ai', 'saas'];
    return h('div', { className: 'service-status-filters' },
      ...categories.map(key =>
        h('button', {
          className: `status-filter-btn ${this.filter === key ? 'active' : ''}`,
          dataset: { filter: key },
          onClick: () => this.setFilter(key),
        }, getCategoryLabel(key)),
      ),
    );
  }

  private buildServiceItems(services: ServiceStatus[]): HTMLElement[] {
    return services.map(service =>
      h('div', { className: `service-status-item ${service.status}` },
        h('span', { className: 'status-icon' }, this.getStatusIcon(service.status)),
        h('span', { className: 'status-name' }, service.name),
        h('span', { className: `status-badge ${service.status}` }, service.status.toUpperCase()),
      ),
    );
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'operational': return '●';
      case 'degraded': return '◐';
      case 'outage': return '○';
      default: return '?';
    }
  }

}
