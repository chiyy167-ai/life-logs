import { Link, useParams } from 'react-router-dom'
import { ActivityList } from '../components/ActivityList'
import { AttachmentList } from '../components/AttachmentList'
import { MoodPicker } from '../components/MoodPicker'
import { WeatherBadge } from '../components/WeatherBadge'
import { useDayData } from '../hooks/useDayData'
import { formatDisplayDate, todayKey } from '../lib/dates'

export function DayPage() {
  const params = useParams()
  const date = params.date ?? todayKey()
  const isToday = date === todayKey()
  const data = useDayData(date)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{isToday ? '今天' : '日记'}</p>
          <h1>{formatDisplayDate(date)}</h1>
        </div>
        {!isToday ? (
          <Link className="link-btn" to="/">
            回到今天
          </Link>
        ) : null}
      </header>

      <WeatherBadge
        weather={data.day?.weather}
        status={data.weatherStatus}
        error={data.weatherError}
        onRefresh={() => void data.refreshWeather()}
      />

      <section className="panel">
        <label className="field">
          标题
          <input
            value={data.title}
            onChange={(e) => data.updateTitle(e.target.value)}
            onBlur={data.flushSave}
            placeholder="给这一天起个名字（可选）"
          />
        </label>
        <div className="field">
          <span>心情</span>
          <MoodPicker value={data.mood} onChange={data.updateMood} />
        </div>
        <label className="field">
          正文
          <textarea
            value={data.body}
            onChange={(e) => data.updateBody(e.target.value)}
            onBlur={data.flushSave}
            rows={8}
            placeholder="写下今天想记住的事…"
          />
        </label>
      </section>

      <ActivityList
        activities={data.activities}
        onAdd={data.addActivity}
        onUpdate={data.updateActivity}
        onRemove={data.removeActivity}
      />

      <AttachmentList
        attachments={data.attachments}
        onAdd={data.addFiles}
        onRemove={data.removeAttachment}
      />
    </div>
  )
}
