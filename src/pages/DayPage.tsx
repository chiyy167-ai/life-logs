import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActivityList } from '../components/ActivityList'
import { AttachmentList } from '../components/AttachmentList'
import { MoodPicker } from '../components/MoodPicker'
import { WeatherPicker } from '../components/WeatherPicker'
import { useDayData } from '../hooks/useDayData'
import { WRITING_PROMPTS } from '../lib/constants'
import { formatDisplayDate, shiftDate, todayKey } from '../lib/dates'

export function DayPage() {
  const params = useParams()
  const navigate = useNavigate()
  const date = params.date ?? todayKey()
  const isToday = date === todayKey()
  const data = useDayData(date)
  const [tagDraft, setTagDraft] = useState('')
  const prompt = WRITING_PROMPTS[Number(date.slice(-2)) % WRITING_PROMPTS.length]
  const { draft } = data

  const go = (delta: number) => {
    const next = shiftDate(date, delta)
    navigate(next === todayKey() ? '/' : `/day/${next}`)
  }

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, '')
    if (!tag || draft.tags.includes(tag)) {
      setTagDraft('')
      return
    }
    data.patchDraft({ tags: [...draft.tags, tag] })
    setTagDraft('')
  }

  return (
    <div className="page">
      <header className="day-mast">
        <div>
          <p className="eyebrow">{isToday ? '今天' : '翻到这一天'}</p>
          <h1>{formatDisplayDate(date)}</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="chip" onClick={() => go(-1)}>
            前一天
          </button>
          <button type="button" className="chip" onClick={() => go(1)} disabled={isToday}>
            后一天
          </button>
          <button
            type="button"
            className={draft.favorite ? 'chip active' : 'chip'}
            onClick={() => data.patchDraft({ favorite: !draft.favorite })}
          >
            {draft.favorite ? '已收藏' : '收藏'}
          </button>
          {!isToday ? (
            <Link className="chip" to="/">
              今天
            </Link>
          ) : null}
        </div>
      </header>

      <WeatherPicker
        weather={data.day?.weather}
        status={data.weatherStatus}
        error={data.weatherError}
        onPick={data.pickWeather}
        onClear={data.clearWeather}
        onRefresh={data.refreshWeather}
      />

      <section className="paper">
        <label className="field bare">
          <span className="sr">标题</span>
          <input
            className="title-input"
            value={draft.title}
            onChange={(e) => data.patchDraft({ title: e.target.value })}
            onBlur={data.flushSave}
            placeholder="给这一天起个名字"
          />
        </label>
        <label className="field">
          今日一句
          <input
            value={draft.highlight}
            onChange={(e) => data.patchDraft({ highlight: e.target.value })}
            onBlur={data.flushSave}
            placeholder="用一句话留下来"
          />
        </label>
        <div className="split">
          <label className="field">
            地点
            <input
              value={draft.place}
              onChange={(e) => data.patchDraft({ place: e.target.value })}
              onBlur={data.flushSave}
              placeholder="在哪里"
            />
          </label>
          <label className="field">
            和谁
            <input
              value={draft.people}
              onChange={(e) => data.patchDraft({ people: e.target.value })}
              onBlur={data.flushSave}
              placeholder="同行的人"
            />
          </label>
        </div>
        <div className="field">
          <span>心情</span>
          <MoodPicker value={draft.mood} onChange={(mood) => data.patchDraft({ mood })} />
        </div>
        <label className="field">
          正文
          <textarea
            value={draft.body}
            onChange={(e) => data.patchDraft({ body: e.target.value })}
            onBlur={data.flushSave}
            rows={9}
            placeholder={prompt}
          />
        </label>
        <div className="field">
          <span>标签</span>
          <div className="tag-row">
            {draft.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip active"
                onClick={() =>
                  data.patchDraft({ tags: draft.tags.filter((item) => item !== tag) })
                }
              >
                #{tag}
              </button>
            ))}
          </div>
          <div className="add-row">
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="加标签，回车确认"
            />
            <button type="button" className="chip" onClick={addTag}>
              添加
            </button>
          </div>
        </div>
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
